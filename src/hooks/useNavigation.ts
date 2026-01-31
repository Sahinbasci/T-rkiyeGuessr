/**
 * useNavigation Hook
 * Dal bazlı gezme sistemi - "Dal başına 1 hak" kuralı
 *
 * Kurallar:
 * - Oyuncu pano0'dan bir dala ilk kez geçerse → 1 hak tüketilir
 * - Aynı dalı tekrar kullanmak (gidip gelmek) → hak tüketmez
 * - Hak bitince dallar disable
 */

import { useState, useCallback, useMemo } from "react";
import {
  PlayerNavigationState,
  BranchKey,
  PanoPackage,
  BRANCH_TO_PANO,
  PANO_TO_BRANCH,
} from "@/types";

interface UseNavigationProps {
  panoPackage: PanoPackage | null;
  moveLimit: number;
  onPanoChange: (panoId: string, heading: number) => void;
}

interface UseNavigationReturn {
  // State
  navState: PlayerNavigationState;
  currentPanoKey: "pano0" | "pano1" | "pano2" | "pano3";
  movesRemaining: number;

  // Actions
  navigateToBranch: (branch: BranchKey) => boolean;
  navigateToCenter: () => void;
  resetNavigation: () => void;

  // Branch durumları
  canNavigateTo: (branch: BranchKey) => boolean;
  isBranchUsed: (branch: BranchKey) => boolean;
  isBranchActive: (branch: BranchKey) => boolean;
}

export function useNavigation({
  panoPackage,
  moveLimit,
  onPanoChange,
}: UseNavigationProps): UseNavigationReturn {
  // Başlangıç state'i
  const initialState: PlayerNavigationState = {
    currentPanoKey: "pano0",
    usedBranches: {
      left: false,
      right: false,
      forward: false,
    },
    movesUsed: 0,
    moveLimit,
  };

  const [navState, setNavState] = useState<PlayerNavigationState>(initialState);

  // Kalan hak sayısı
  const movesRemaining = useMemo(() => {
    return navState.moveLimit - navState.movesUsed;
  }, [navState.moveLimit, navState.movesUsed]);

  // Bir dala gidebilir mi?
  const canNavigateTo = useCallback(
    (branch: BranchKey): boolean => {
      if (!panoPackage) return false;

      // Zaten o dalda mıyız?
      const targetPano = BRANCH_TO_PANO[branch];
      if (navState.currentPanoKey === targetPano) return false;

      // Dal daha önce kullanıldıysa → hak yemeden gidebilir
      if (navState.usedBranches[branch]) return true;

      // Dal ilk kez kullanılacaksa → hak var mı?
      return movesRemaining > 0;
    },
    [panoPackage, navState, movesRemaining]
  );

  // Dal kullanılmış mı?
  const isBranchUsed = useCallback(
    (branch: BranchKey): boolean => {
      return navState.usedBranches[branch];
    },
    [navState.usedBranches]
  );

  // Dal aktif mi (şu an o dalda mıyız)?
  const isBranchActive = useCallback(
    (branch: BranchKey): boolean => {
      const targetPano = BRANCH_TO_PANO[branch];
      return navState.currentPanoKey === targetPano;
    },
    [navState.currentPanoKey]
  );

  // Bir dala git
  const navigateToBranch = useCallback(
    (branch: BranchKey): boolean => {
      if (!panoPackage) return false;
      if (!canNavigateTo(branch)) return false;

      const targetPanoKey = BRANCH_TO_PANO[branch];
      const targetPano = panoPackage[targetPanoKey];

      // State güncelle
      setNavState((prev) => {
        const isFirstTime = !prev.usedBranches[branch];
        return {
          ...prev,
          currentPanoKey: targetPanoKey,
          usedBranches: {
            ...prev.usedBranches,
            [branch]: true,
          },
          movesUsed: isFirstTime ? prev.movesUsed + 1 : prev.movesUsed,
        };
      });

      // Street View'ı güncelle
      onPanoChange(targetPano.panoId, targetPano.heading);
      return true;
    },
    [panoPackage, canNavigateTo, onPanoChange]
  );

  // Merkeze (pano0) dön
  const navigateToCenter = useCallback(() => {
    if (!panoPackage) return;

    // Zaten merkezdeysek bir şey yapma
    if (navState.currentPanoKey === "pano0") return;

    setNavState((prev) => ({
      ...prev,
      currentPanoKey: "pano0",
    }));

    // Street View'ı güncelle
    onPanoChange(panoPackage.pano0.panoId, panoPackage.pano0.heading);
  }, [panoPackage, navState.currentPanoKey, onPanoChange]);

  // Navigasyonu sıfırla (yeni round için)
  const resetNavigation = useCallback(() => {
    setNavState({
      currentPanoKey: "pano0",
      usedBranches: {
        left: false,
        right: false,
        forward: false,
      },
      movesUsed: 0,
      moveLimit,
    });
  }, [moveLimit]);

  return {
    navState,
    currentPanoKey: navState.currentPanoKey,
    movesRemaining,
    navigateToBranch,
    navigateToCenter,
    resetNavigation,
    canNavigateTo,
    isBranchUsed,
    isBranchActive,
  };
}
