// src/components/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../constants/navigation.js";

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-[200px] shrink-0 rounded-lg border bg-white p-3 flex flex-col items-center mt-1">
      {NAV_ITEMS.map((it) => {
        const active =
          it.path === "/" ? pathname === "/" : pathname.startsWith(it.path);
        const img = `/${it.key}_${active ? "SEL" : "BTN"}.png`;
        return (
          <NavLink
            key={it.key}
            to={it.path}
            className="block w-[200px] h-[56px]"
          >
            <img
              src={img}
              alt={it.key}
              className="w-[200px] h-[56px] object-contain transition-transform duration-150 hover:brightness-110 active:scale-95"
            />
          </NavLink>
        );
      })}
    </aside>
  );
}
