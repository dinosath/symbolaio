import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { getClient, LOGIN_MUTATION, REGISTER_MUTATION } from '../api/graphql';
import type { AuthPayload } from '../types';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      const client = getClient();
      if (isRegister) {
        const data = await client.request<{ register: AuthPayload }>(
          REGISTER_MUTATION,
          { input: { email, password, displayName } },
        );
        return data.register;
      } else {
        const data = await client.request<{ login: AuthPayload }>(
          LOGIN_MUTATION,
          { input: { email, password } },
        );
        return data.login;
      }
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.userId);
      navigate('/');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-brand-900 mb-6">
          Symbolaio
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          {isRegister && (
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          )}
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
          >
            {mutation.isPending
              ? 'Loading…'
              : isRegister
                ? 'Register'
                : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            className="text-brand-600 hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
