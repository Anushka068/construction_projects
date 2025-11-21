import React from "react";
import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="p-10 text-center">
      <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
      <p className="mt-4 text-gray-700">
        Something went wrong or this page does not exist.
      </p>

      <p className="mt-2 text-gray-500 text-sm">
        {error?.status} — {error?.statusText}
      </p>

      <Link
        to="/dashboard"
        className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
