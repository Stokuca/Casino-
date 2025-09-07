// src/pages/NotFound.tsx
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-2xl font-semibold mb-4">404 — Not Found</h1>
      <Link className="text-blue-600 underline" to="/">Go home</Link>
    </div>
  );
}
