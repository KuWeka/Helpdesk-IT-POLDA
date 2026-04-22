
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form.jsx';
import { Input } from '@/components/ui/input.jsx';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const { signup } = useAuth();
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      phone: '',
    },
  });
  const {
    formState: { isSubmitting },
    setError,
  } = form;

  const onSubmit = async (values) => {
    if (values.password !== values.passwordConfirm) {
      setError('passwordConfirm', { type: 'manual', message: 'Password konfirmasi tidak cocok' });
      return;
    }

    if (values.password.length < 8) {
      setError('password', { type: 'manual', message: 'Password minimal 8 karakter' });
      return;
    }

    try {
      await signup(values);
    } catch (err) {
      setError('email', { type: 'manual', message: err.message || 'Pendaftaran gagal.' });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2, 6, 23, 0.58), rgba(2, 6, 23, 0.68)), url('/images/polda_kalsel.png')",
      }}
    >
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-2 rounded-xl shadow-lg">
            <img
              src="/images/logo_bidtik.png"
              alt="Logo BIDTIK"
              className="size-16 object-contain"
            />
          </div>
        </div>

        <Card className="border-border shadow-xl rounded-2xl">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-4xl font-bold tracking-tight text-foreground">Buat Akun</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Daftar untuk membuat tiket bantuan
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="Nama lengkap" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Email" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP / WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="No. HP" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? 'Sembunyikan' : 'Lihat'}
                        </button>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Konfirmasi Password</FormLabel>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setShowPasswordConfirm((v) => !v)}
                        >
                          {showPasswordConfirm ? 'Sembunyikan' : 'Lihat'}
                        </button>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPasswordConfirm ? 'text' : 'password'}
                          placeholder="Konfirmasi Password"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-6">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Daftar
                </Button>
                <div className="text-xs text-center text-muted-foreground">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Masuk
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
