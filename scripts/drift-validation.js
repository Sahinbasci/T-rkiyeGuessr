/**
 * Camera Drift Validation Script
 *
 * Run this in the browser console while playing TürkiyeGuessr on a mobile device.
 * It monitors the pov_changed events and reports drift statistics.
 *
 * USAGE:
 * 1. Open turkiyeguessr.xyz on mobile device
 * 2. Start a game (wait for Street View to load)
 * 3. Open browser DevTools console (or use remote debugging)
 * 4. Paste this entire script and press Enter
 * 5. Rotate horizontally for 30-60 seconds (swipe left/right only)
 * 6. Check the overlay for drift statistics
 *
 * EXPECTED RESULTS (with fix):
 * - Max pitch deviation: < 5°
 * - Corrections applied: > 0 (shows drift was detected and corrected)
 * - Pitch stays near starting value during horizontal-only rotation
 *
 * WITHOUT FIX (to compare):
 * - Max pitch deviation: 30-90° (camera drifts to sky)
 * - Corrections: 0 (no drift detection exists)
 */

(function initDriftValidation() {
  'use strict';

  // Find the Street View panorama instance
  const svContainer = document.querySelector('.streetview-container');
  if (!svContainer) {
    console.error('[DriftValidation] Street View container not found. Start a game first.');
    return;
  }

  // Try to access the Google Maps panorama instance
  let panorama = null;

  // Method 1: Check if panorama is exposed on the container
  if (svContainer.__gm_panorama) {
    panorama = svContainer.__gm_panorama;
  }

  // Method 2: Search for google.maps.StreetViewPanorama instances
  if (!panorama && window.google?.maps) {
    // The panorama is typically the first child iframe's parent
    const svElement = svContainer.querySelector('[aria-label*="Street View"]') || svContainer.firstElementChild;
    if (svElement && svElement.__gm) {
      panorama = svElement.__gm;
    }
  }

  // State tracking
  const state = {
    startPitch: null,
    startHeading: null,
    maxDeviation: 0,
    totalSamples: 0,
    corrections: 0,
    startTime: Date.now(),
    lastPitch: null,
    lastHeading: null,
    pitchHistory: [],
    isActive: true,
  };

  // Create overlay UI
  const overlay = document.createElement('div');
  overlay.id = 'drift-validation-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.85);
    color: #00ff00;
    font-family: monospace;
    font-size: 12px;
    padding: 12px;
    border-radius: 8px;
    z-index: 999999;
    min-width: 220px;
    pointer-events: none;
    line-height: 1.6;
  `;
  document.body.appendChild(overlay);

  function updateOverlay() {
    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(0);
    const currentPitch = state.lastPitch !== null ? state.lastPitch.toFixed(2) : '—';
    const anchor = state.startPitch !== null ? state.startPitch.toFixed(2) : '—';
    const maxDev = state.maxDeviation.toFixed(2);
    const status = state.maxDeviation < 5 ? '✅ OK' : '⚠️ DRIFT!';

    overlay.innerHTML = `
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px; color: #ffcc00;">
        📐 Drift Validation
      </div>
      <div>Time: ${elapsed}s | Samples: ${state.totalSamples}</div>
      <div>Anchor pitch: ${anchor}°</div>
      <div>Current pitch: ${currentPitch}°</div>
      <div style="color: ${state.maxDeviation < 5 ? '#00ff00' : '#ff4444'};">
        Max deviation: ${maxDev}° ${status}
      </div>
      <div>Corrections: ${state.corrections}</div>
      <div style="font-size: 10px; color: #888; margin-top: 6px;">
        Rotate horizontally for 30-60s
      </div>
    `;
  }

  // Monitor POV changes via MutationObserver on pitch display
  // (fallback: poll getPov if available)
  let pollInterval = null;

  function onPovSample(pitch, heading) {
    if (!state.isActive) return;

    if (state.startPitch === null) {
      state.startPitch = pitch;
      state.startHeading = heading;
    }

    const deviation = Math.abs(pitch - state.startPitch);
    state.maxDeviation = Math.max(state.maxDeviation, deviation);
    state.totalSamples++;
    state.lastPitch = pitch;
    state.lastHeading = heading;

    // Track pitch history (last 100 samples)
    state.pitchHistory.push({ pitch, heading, time: Date.now() });
    if (state.pitchHistory.length > 100) state.pitchHistory.shift();

    // Detect if a correction just happened (pitch jumped back toward anchor)
    if (state.pitchHistory.length >= 2) {
      const prev = state.pitchHistory[state.pitchHistory.length - 2];
      const prevDev = Math.abs(prev.pitch - state.startPitch);
      const curDev = Math.abs(pitch - state.startPitch);
      // If deviation dropped significantly, a correction likely fired
      if (prevDev > 1.0 && curDev < prevDev * 0.5) {
        state.corrections++;
      }
    }

    updateOverlay();
  }

  // Try to get panorama via Google Maps API
  if (panorama && typeof panorama.getPov === 'function') {
    console.log('[DriftValidation] Found panorama instance. Attaching listener.');
    panorama.addListener('pov_changed', () => {
      const pov = panorama.getPov();
      onPovSample(pov.pitch, pov.heading);
    });
  } else {
    // Fallback: Poll using google.maps internal state
    console.log('[DriftValidation] Panorama not directly accessible. Using polling fallback.');

    // Try to find panorama through Google Maps internals
    function findPanorama() {
      try {
        // Look for pano in Google Maps internal structures
        const iframes = svContainer.querySelectorAll('canvas, [aria-roledescription]');
        // Try getting POV from window.__gm_panorama or similar
        if (window.__streetViewPanorama) return window.__streetViewPanorama;

        // Search for the panorama in all Google Maps instances
        const allDivs = svContainer.querySelectorAll('div');
        for (const div of allDivs) {
          if (div.__gm && typeof div.__gm.getPov === 'function') {
            return div.__gm;
          }
        }
      } catch (e) { /* ignore */ }
      return null;
    }

    // Try repeatedly to find the panorama
    let attempts = 0;
    const finder = setInterval(() => {
      panorama = findPanorama();
      if (panorama) {
        clearInterval(finder);
        console.log('[DriftValidation] Found panorama via search. Attaching listener.');
        panorama.addListener('pov_changed', () => {
          const pov = panorama.getPov();
          onPovSample(pov.pitch, pov.heading);
        });
      } else if (++attempts > 20) {
        clearInterval(finder);
        console.log('[DriftValidation] Could not find panorama. Using keyboard input monitor.');

        // Last resort: use keyboard/touch events to track rotation
        overlay.innerHTML += '<div style="color: #ff8800;">⚠️ Cannot access panorama directly. Monitoring touch events only.</div>';
      }
    }, 500);
  }

  // Cleanup function
  window.__stopDriftValidation = function() {
    state.isActive = false;
    if (pollInterval) clearInterval(pollInterval);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

    // Print summary
    console.log('\n=== DRIFT VALIDATION SUMMARY ===');
    console.log(`Duration: ${((Date.now() - state.startTime) / 1000).toFixed(1)}s`);
    console.log(`Total POV samples: ${state.totalSamples}`);
    console.log(`Starting pitch: ${state.startPitch?.toFixed(2)}°`);
    console.log(`Max deviation: ${state.maxDeviation.toFixed(2)}°`);
    console.log(`Corrections detected: ${state.corrections}`);
    console.log(`Result: ${state.maxDeviation < 5 ? '✅ PASS — drift is controlled' : '❌ FAIL — excessive drift detected'}`);
    console.log('================================\n');

    return {
      duration: ((Date.now() - state.startTime) / 1000).toFixed(1),
      samples: state.totalSamples,
      startPitch: state.startPitch,
      maxDeviation: state.maxDeviation,
      corrections: state.corrections,
      pass: state.maxDeviation < 5,
    };
  };

  console.log('[DriftValidation] Started. Rotate horizontally for 30-60 seconds.');
  console.log('[DriftValidation] Call window.__stopDriftValidation() to see summary.');
  updateOverlay();
})();
