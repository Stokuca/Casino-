import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { login } from "../api/auth";
import { setSession } from "../store/slices/authSlice";

const Schema = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string().min(4).required(),
});

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-sm mt-16 bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Schema}
        onSubmit={async (values, helpers) => {
          try {
            const session = await login(values); // server postavlja cookie, mi čitamo /auth/me
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
              <Field name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" />
              {touched.email && errors.email && <p className="text-red-600 text-xs">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm">Password</label>
              <Field name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" />
              {touched.password && errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}
            </div>
            {status && <p className="text-red-600 text-sm">{status}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded bg-gray-900 text-white py-2 disabled:opacity-50">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
