
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form.jsx';
import { Input } from '@/components/ui/input.jsx';
import SectionHeader from '@/components/SectionHeader.jsx';

const SYSTEM_NAME = 'IT Helpdesk';
const SYSTEM_TAGLINE = 'Sistem Pelaporan IT Polda Kalsel';
const SYSTEM_DESCRIPTION = 'Kelola tiket support dengan efisien dan transparan';

export default function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });
  const {
    formState: { isSubmitting },
    setError,
  } = form;

  const onSubmit = async (values) => {
    if (!values.identifier || !values.password) {
      const message = t('login.error_wrong_credentials', 'Email/Username dan password wajib diisi.');
      setError('identifier', { type: 'manual', message });
      setError('password', { type: 'manual', message });
      return;
    }

    try {
      await login(values.identifier, values.password);
      toast.success('Login berhasil');
    } catch (err) {
      const message = err.message || t('login.error_wrong_credentials', 'Terjadi kesalahan saat login.');
      setError('identifier', { type: 'manual', message });
      setError('password', { type: 'manual', message });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2, 6, 23, 0.58), rgba(2, 6, 23, 0.68)), url('/images/polda_kalsel.png')",
      }}
    >
      {/* Left side - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start px-8 py-12">
        <div className="max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex size-24 items-center justify-center rounded-2xl shadow-lg">
              <img
                src="/images/logo_bidtik.png"
                alt="Logo BIDTIK"
                className="size-16 object-contain"
              />
            </div>
            <div className="text-4xl font-bold tracking-tight text-foreground">
              {SYSTEM_NAME}
            </div>
            <p className="text-xl font-semibold text-primary">
              {SYSTEM_TAGLINE}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              {SYSTEM_DESCRIPTION}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20">
                <span className="text-xs font-bold text-green-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manajemen Tiket Terpusat</h3>
                <p className="text-sm text-muted-foreground">Kelola semua tiket support dari satu dashboard</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <span className="text-xs font-bold text-blue-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chat Real-time</h3>
                <p className="text-sm text-muted-foreground">Komunikasi instant dengan teknisi support</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-xs font-bold text-amber-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Analytics & Laporan</h3>
                <p className="text-sm text-muted-foreground">Pantau performa support dengan dashboard analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mobile branding */}
        <div className="mb-6 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex size-20 items-center justify-center rounded-2xl shadow-lg">
            <img
              src="/images/logo_bidtik.png"
              alt="Logo BIDTIK"
              className="size-12 object-contain"
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight">{SYSTEM_NAME}</div>
            <p className="text-sm text-muted-foreground mt-1">{SYSTEM_TAGLINE}</p>
          </div>
        </div>

        <Card className="border bg-card/95 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <SectionHeader
              title="Masuk ke Akun"
              subtitle="Gunakan email atau username untuk masuk ke sistem"
            />
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email atau Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="admin@example.com atau admin"
                            disabled={isSubmitting}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Lupa password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan password Anda"
                            disabled={isSubmitting}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            disabled={isSubmitting}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-6 pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Belum punya akun? </span>
                  <Link to="/signup" className="font-semibold text-primary hover:underline">
                    Daftar di sini
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div className="mt-8 text-center flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">© 2026 {SYSTEM_NAME}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Untuk bantuan, hubungi: support@polda.go.id</p>
        </div>
      </div>
    </div>
  );
}
