import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { setSession } from "../store/slices/authSlice";
import { login } from "../api/auth";

const Schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Min 4 characters").required("Required"),
});

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Schema}
        onSubmit={async (values, helpers) => {
          try {
            const session = await login(values); // server postavlja httpOnly cookie; vraća {role, user}
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
              <Field
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                className="mt-1 w-full rounded border px-3 py-2"
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm">Password</label>
              <Field
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded border px-3 py-2"
              />
              {touched.password && errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {status && <p className="text-sm text-red-600">{status}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>

            <p className="mt-2 text-center text-sm text-gray-600">
              Nemate nalog?{" "}
              <Link to="/register" className="underline">
                Kreirajte nalog
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
