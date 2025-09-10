import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { setSession } from "../store/slices/authSlice";
import { loginPlayer, loginOperator } from "../api/auth";
import { useState } from "react";

const Schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Min 4 characters").required("Required"),
});

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"player" | "operator">("player");

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>

      <div className="mb-4 flex rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("player")}
          className={`w-1/2 px-3 py-2 text-sm ${mode === "player" ? "bg-gray-900 text-white" : "bg-white"}`}
        >
          Player
        </button>
        <button
          type="button"
          onClick={() => setMode("operator")}
          className={`w-1/2 px-3 py-2 text-sm ${mode === "operator" ? "bg-gray-900 text-white" : "bg-white"}`}
        >
          Operator
        </button>
      </div>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Schema}
        onSubmit={async (values, helpers) => {
          try {
            const session =
              mode === "operator"
                ? await loginOperator(values)
                : await loginPlayer(values);

            dispatch(setSession(session));
            navigate(session.role === "operator" ? "/operator" : "/player", { replace: true });
          } catch (e: any) {
            helpers.setStatus(e?.response?.data?.message ?? "Login failed");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form className="space-y-3">
            <div>
              <label className="block text-sm">Email</label>
              <Field name="email" type="email" autoComplete="email" autoFocus className="mt-1 w-full rounded border px-3 py-2" />
              {touched.email && errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm">Password</label>
              <Field name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded border px-3 py-2" />
              {touched.password && errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {status && <p className="text-sm text-red-600">{status}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>

            <p className="mt-2 text-center text-sm text-gray-600">
              Nemate nalog? <Link to="/register" className="underline">Kreirajte nalog</Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
