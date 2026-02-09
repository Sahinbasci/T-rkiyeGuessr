import { UserMinus, UserPlus, Crown, X } from "lucide-react";
import { GameNotification } from "@/hooks";

interface NotificationListProps {
  notifications: GameNotification[];
  dismissNotification: (id: string) => void;
}

export function NotificationList({ notifications, dismissNotification }: NotificationListProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-badge flex flex-col gap-2" aria-live="polite" role="status">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`glass rounded-xl p-3 flex items-center gap-3 animate-slideDown ${
            notification.type === "player_left"
              ? "border-red-500/50 bg-red-500/10"
              : notification.type === "player_joined"
              ? "border-green-500/50 bg-green-500/10"
              : notification.type === "host_changed"
              ? "border-yellow-500/50 bg-yellow-500/10"
              : "border-gray-500/50"
          }`}
        >
          {notification.type === "player_left" && (
            <UserMinus size={16} className="text-red-400 flex-shrink-0" />
          )}
          {notification.type === "player_joined" && (
            <UserPlus size={16} className="text-green-400 flex-shrink-0" />
          )}
          {notification.type === "host_changed" && (
            <Crown size={16} className="text-yellow-400 flex-shrink-0" />
          )}
          <span className="text-sm flex-1">{notification.message}</span>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="text-gray-400 hover:text-white transition p-1.5 touch-target"
            aria-label="Bildirimi kapat"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
