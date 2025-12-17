'use client';

import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { Sparkles, Zap, Target, TrendingUp, BarChart3, Search } from 'lucide-react';

// Floating icon component
function FloatingIcon({ icon: Icon, delay, duration, x, y }: {
  icon: React.ElementType;
  delay: number;
  duration: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className="absolute text-primary/20"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.5, 0],
        scale: [0.5, 1, 0.5],
        y: [0, -30, 0],
        rotate: [0, 10, -10, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon className="w-8 h-8" />
    </motion.div>
  );
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(25 95% 53% / 0.1) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated line */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ y: [0, 800, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Feature card for left side
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="p-2 rounded-lg bg-primary/20">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        <p className="text-white/60 text-xs mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

function LoginContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-12 flex-col justify-between">
        <GridBackground />

        {/* Floating Icons */}
        {mounted && (
          <>
            <FloatingIcon icon={Search} delay={0} duration={6} x="20%" y="20%" />
            <FloatingIcon icon={TrendingUp} delay={1} duration={7} x="70%" y="15%" />
            <FloatingIcon icon={Target} delay={2} duration={5} x="80%" y="60%" />
            <FloatingIcon icon={BarChart3} delay={3} duration={8} x="15%" y="70%" />
            <FloatingIcon icon={Zap} delay={4} duration={6} x="60%" y="80%" />
          </>
        )}

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/seoart-logo-horizontal.svg"
              alt="SEOART Logo"
              width={200}
              height={50}
              priority
            />
          </motion.div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              SEO Süreçlerinizi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                Otomatikleştirin
              </span>
            </h1>
            <p className="text-white/60 mt-4 text-lg">
              Keyword araştırmasından içerik üretimine, tüm SEO süreçleriniz tek platformda.
            </p>
          </motion.div>

          <div className="space-y-3 pt-4">
            <FeatureCard
              icon={Search}
              title="Keyword Keşfi"
              description="Rakip analizi ve fırsat tespiti"
              delay={0.4}
            />
            <FeatureCard
              icon={Sparkles}
              title="İçerik Motoru"
              description="Bulk içerik üretimi ve yönetimi"
              delay={0.5}
            />
            <FeatureCard
              icon={Target}
              title="Link Haritası"
              description="Site içi bağlantı optimizasyonu"
              delay={0.6}
            />
          </div>
        </div>

        <motion.div
          className="relative z-10 text-white/40 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          © 2026 SEOART. Tüm hakları saklıdır.
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile background effects */}
        <div className="lg:hidden fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-orange-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            className="lg:hidden text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Image
              src="/seoart-logo-horizontal.svg"
              alt="SEOART Logo"
              width={180}
              height={45}
              priority
              className="mx-auto"
            />
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Hoş geldiniz! 👋
            </h2>
            <p className="text-muted-foreground mt-2">
              Devam etmek için hesabınıza giriş yapın
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            className="rounded-2xl glass-2 p-8 border border-[hsl(var(--glass-border-subtle))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <LoginForm />
          </motion.div>

          {/* Bottom Links */}
          <motion.div
            className="mt-6 text-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground">
              Hesabınız yok mu?{' '}
              <span className="text-primary hover:underline cursor-pointer">
                İletişime geçin
              </span>
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
              <span>Güvenli bağlantı</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>256-bit SSL</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
