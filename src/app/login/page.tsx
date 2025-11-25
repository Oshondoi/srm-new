'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerFullName, setRegisterFullName] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }

      console.log('Логин успешен:', data.user)

      // Save token to localStorage and cookie
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Set cookie with proper flags
      document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

      console.log('Cookie установлена, редирект через 100ms')

      // Force hard redirect to ensure middleware runs
      setTimeout(() => {
        console.log('Выполняю редирект...')
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Client-side validation
    if (registerPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      setLoading(false)
      return
    }

    // Check for weak passwords
    const weakPasswords = ['12345678', '123456789', '1234567890', 'password', 'qwerty123', '87654321']
    if (weakPasswords.includes(registerPassword.toLowerCase())) {
      setError('Этот пароль слишком простой. Используйте более сложную комбинацию')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          full_name: registerFullName
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка регистрации')
      }

      console.log('Регистрация успешна:', data.user)

      // Save token to localStorage and cookie
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Set cookie with proper flags
      document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

      console.log('Cookie установлена, редирект через 100ms')

      // Force hard redirect to ensure middleware runs
      setTimeout(() => {
        console.log('Выполняю редирект...')
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card container with overflow hidden for sliding effect */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Sliding forms container */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: isLogin ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            {/* Login Form */}
            <div className="w-full min-w-full p-8 flex-shrink-0">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Вход</h2>
              <p className="text-gray-600 mb-6">Добро пожаловать!</p>

              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    placeholder="Введите пароль"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Загрузка...' : 'Войти'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setError('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Нет аккаунта? Зарегистрироваться
                </button>
              </div>
            </div>

            {/* Register Form */}
            <div className="w-full min-w-full p-8 flex-shrink-0">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Регистрация</h2>
              <p className="text-gray-600 mb-6">Создайте аккаунт</p>

              <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    placeholder="Иван Иванов"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    placeholder="Минимум 8 символов"
                    minLength={8}
                  />
                  {registerPassword.length > 0 && registerPassword.length < 8 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Еще {8 - registerPassword.length} символов
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Уже есть аккаунт? Войти
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          CRM система для управления продажами
        </p>
      </div>
    </div>
  )
}
