'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@coppel.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Explicitly redirect to the real dashboard route
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-primary/10 shadow-2xl">
          <CardHeader className="text-center">
             <div className="flex justify-center items-center mb-6">
                <div className="h-24 w-24 rounded-[32px] bg-background border border-primary/10 flex items-center justify-center overflow-hidden shadow-inner">
                    <img 
                        src="/logo.png" 
                        alt="Logo ScreenSight" 
                        className="h-full w-full object-cover scale-[1.05] rounded-[inherit]" 
                    />
                </div>
             </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase">ScreenSight</CardTitle>
            <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-primary">Admin Login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@coppel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full font-black uppercase tracking-widest" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}