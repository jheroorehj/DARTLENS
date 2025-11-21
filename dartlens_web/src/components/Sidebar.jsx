import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../constants/navigation";

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      {NAV_ITEMS.map((item) => {
        /**
         * Determine if this nav item is active
         *
         * Special case for home: Only active if exactly at "/"
         * Other routes: Active if pathname starts with the route path
         */
        const isActive =
          item.path === "/"
            ? pathname === "/"
            : pathname.startsWith(item.path);

        /**
         * Build image path based on active state
         *
         * Convention: /navkey_BTN.png (inactive) or /navkey_SEL.png (selected)
         */
        const imagePath = `/${item.key}_${isActive ? "SEL" : "BTN"}.png`;

        return (
          <NavLink
            key={item.key}
            to={item.path}
            className="sidebar-link"
            aria-label={item.label}
          >
            <img
              src={imagePath}
              alt={item.label}
            />
          </NavLink>
        );
      })}
    </aside>
  );
}
