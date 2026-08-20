import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, Mail, User, Sparkles } from 'lucide-react';
import { setUser } from '../../../store/slices/userSlice';
import { api } from '../../../services/api';
import { setTokens, getCurrentUser } from '../../../services/auth';
import { LOGO_CIRCLED_DATA_URI } from '../../../assets/logoBase64';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const validateClientSide = (): string | null => {
    if (isLogin) {
      if (!emailOrUsername.trim()) {
        return 'Please enter your email or username.';
      }
      if (!password) {
        return 'Please enter your password.';
      }
      return null;
    }

    // Register validations
    const cleanEmail = email.trim();
    const cleanUsername = username.trim();

    if (!cleanEmail) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!cleanUsername) {
      return 'Username is required.';
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return 'Username must be between 3 and 20 characters.';
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return 'Username can only contain letters, numbers, underscores, or hyphens.';
    }

    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number (0-9).';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%...).';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match. Please re-enter confirm password.';
    }

    return null;
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setError('');

    const validationError = validateClientSide();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login API
        const response = await api.post('/auth/login', {
          emailOrUsername: emailOrUsername.trim(),
          password: password,
        });
        const data = response.data?.data || response.data;
        const accessToken = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;

        await setTokens(accessToken, refreshToken);
        await getCurrentUser().catch(() => {
          dispatch(
            setUser({
              username: emailOrUsername.trim(),
              email: emailOrUsername.includes('@')
                ? emailOrUsername.trim()
                : `${emailOrUsername.trim()}@melo.local`,
            }),
          );
        });
      } else {
        // Register API
        const response = await api.post('/auth/register', {
          email: email.trim(),
          username: username.trim(),
          password: password,
          displayName: displayName.trim() || username.trim(),
        });
        const data = response.data?.data || response.data;
        const accessToken = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;

        await setTokens(accessToken, refreshToken);
        await getCurrentUser().catch(() => {
          dispatch(
            setUser({
              username: username.trim(),
              email: email.trim(),
              profile: { displayName: displayName.trim() || username.trim() },
            }),
          );
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        err.message ||
        'Authentication failed. Please check your credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#20202A',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    WebkitTextFillColor: '#FFFFFF',
    outline: 'none',
    fontSize: '13px',
  };

  return (
    <div
      className="flex flex-col justify-between p-6 text-white select-none"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div>
        {/* Logo & Headline */}
        <div className="text-center mb-5">
          <div className="inline-block relative mb-2">
            <img
              src={LOGO_CIRCLED_DATA_URI}
              alt="Melo Logo"
              className="w-16 h-16 object-contain mx-auto drop-shadow-[0_0_15px_rgba(224,100,93,0.45)]"
            />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isLogin ? 'Sign in to access your library & playlists' : 'Stream your favourite tracks anywhere'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-start space-x-2.5">
            <span className="text-red-400 font-bold shrink-0">⚠️</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form Container (Using div to avoid triggering host-page password autofill/prompts) */}
        <div className="space-y-3.5">
          {isLogin ? (
            /* Login Fields */
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="melo_acc_id"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="name@example.com or username"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-3.5 py-2.5 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="melo_acc_pwd"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="••••••••"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-10 py-2.5 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Register Fields */
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    name="melo_reg_email"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="you@domain.com"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-3.5 py-2 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    name="melo_reg_username"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="username"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-3.5 py-2 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Display Name <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Sparkles size={15} />
                  </div>
                  <input
                    type="text"
                    name="melo_reg_display"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="Your Name"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-3.5 py-2 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="melo_reg_pwd"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="Min 8 chars, 1 uppercase, 1 special"
                    style={inputStyle}
                    className="w-full rounded-xl pl-10 pr-10 py-2 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="melo_reg_pwd_confirm"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    placeholder="Re-enter password"
                    style={{
                      ...inputStyle,
                      borderColor:
                        confirmPassword && confirmPassword !== password
                          ? 'rgba(239, 68, 68, 0.7)'
                          : 'rgba(255, 255, 255, 0.14)',
                    }}
                    className="w-full rounded-xl pl-10 pr-10 py-2 placeholder-gray-500 focus:border-[#E0645D] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit(e);
            }}
            disabled={isLoading}
            className="w-full mt-3 py-3 bg-[#E0645D] hover:bg-[#C94F48] active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-glow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center space-x-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Switch between Sign In / Register */}
      <div className="text-center pt-4 mt-3.5 border-t border-white/10 text-xs text-gray-400">
        {isLogin ? (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAuthMode(false);
              }}
              className="text-[#E0645D] hover:text-[#F5B7B3] font-semibold hover:underline cursor-pointer ml-1"
            >
              Register
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAuthMode(true);
              }}
              className="text-[#E0645D] hover:text-[#F5B7B3] font-semibold hover:underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
