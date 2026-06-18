import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]).{8,16}$/;

function validate({ name, email, address, password }) {
  const errors = {};

  if (!name || name.trim().length < 20 || name.trim().length > 60) {
    errors.name = 'Name must be between 20 and 60 characters';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!address || address.length > 400) {
    errors.address = 'Address is required and must not exceed 400 characters';
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.password = '8-16 characters, with at least one uppercase letter and one special character';
  }

  return errors;
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signup(form);
      navigate('/stores');
    } catch (err) {
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((e) => {
          serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      } else {
        setServerError(err.response?.data?.message || 'Could not sign up. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-12 pb-20">
      <div className="auth-card">
        <h1>Create an account</h1>
        <p className="text-muted">Sign up to start rating stores.</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} autoFocus />
            {errors.name ? (
              <div className="field-error">{errors.name}</div>
            ) : (
              <div className="field-hint">20-60 characters</div>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="address">Address</label>
            <textarea id="address" name="address" rows={3} value={form.address} onChange={handleChange} />
            {errors.address && <div className="field-error">{errors.address}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
            {errors.password ? (
              <div className="field-error">{errors.password}</div>
            ) : (
              <div className="field-hint">8-16 characters, one uppercase letter, one special character</div>
            )}
          </div>

          <button type="submit" className="btn w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
