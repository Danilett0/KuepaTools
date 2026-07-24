import { Trash2 } from "lucide-react";

/**
 * Global clear/limpiar button used across the entire app.
 * Uses the `.btn-clear` CSS class for consistent styling.
 *
 * @param {Object} props
 * @param {function} props.onClick - Click handler
 * @param {string} [props.title] - Optional tooltip text (defaults to "Limpiar")
 */
export default function ClearButton({ onClick, title = "Limpiar" }) {
  return (
    <button className="btn-clear" onClick={onClick} title={title}>
      <Trash2 size={12} />
      Limpiar
    </button>
  );
}
