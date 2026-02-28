import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { 
  ScanLine, ArrowRight, Check, BarChart3, Shield, Zap, Brain, 
  Store, Users, Layers, ChevronRight, Globe, Clock, Target,
  Menu, X, Eye, Box, TrendingUp, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-foreground">{count}{suffix}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

const features = [
  { icon: Eye, title: 'AI Vision Detection', desc: 'Multimodal AI analyzes shelf images to detect SKUs, count facings, and calculate share of shelf in seconds.' },
  { icon: Target, title: 'Planogram Compliance', desc: 'Compare actual shelf layouts against planned planograms. Get instant compliance scores and missing product alerts.' },
  { icon: Brain, title: 'Custom Model Training', desc: 'Train YOLOv8 models on your product catalog with our integrated annotation and training pipeline.' },
  { icon: BarChart3, title: 'Share of Shelf Analytics', desc: 'Real-time dashboards showing shelf presence, category breakdown, and competitive positioning metrics.' },
  { icon: Shield, title: 'Multi-Tenant RBAC', desc: 'Enterprise-grade role-based access with 4-tier hierarchy: Owner, Admin, Tenant Admin, and Tenant User.' },
  { icon: Zap, title: 'Quota Management', desc: 'Configurable rate limits per tenant — daily, weekly, monthly, yearly caps with automatic enforcement.' },
];

const useCases = [
  { icon: Store, title: 'Retail Chains', desc: 'Monitor shelf compliance across hundreds of stores with automated photo analysis and real-time alerts.' },
  { icon: Box, title: 'CPG Brands', desc: 'Verify product placement, facing counts, and competitor presence across your retail distribution network.' },
  { icon: TrendingUp, title: 'Merchandising Teams', desc: 'Automate field audits with mobile-friendly detection. Replace manual shelf checks with AI-powered verification.' },
  { icon: Cpu, title: 'Analytics Providers', desc: 'Integrate ALPHA IR\'s detection API into your analytics platform via our comprehensive REST and Edge Function APIs.' },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)']);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'Platform', href: '#platform' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <motion.header 
        style={{ backgroundColor: headerBg as any }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-transparent transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <ScanLine className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">ALPHA IR</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm" className="gap-1.5">Get Started <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground py-2">{l.label}</a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Sign In</Button></Link>
                <Link to="/signup" className="flex-1"><Button className="w-full" size="sm">Get Started</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary/8 via-transparent to-transparent blur-3xl" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
              <span className="text-xs font-medium text-primary">AI-Powered Shelf Intelligence</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Transform Shelf Images<br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Into Actionable Insights</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              ALPHA IR is the enterprise platform for retail SKU detection, planogram compliance, and share of shelf analytics — powered by computer vision and AI.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg btn-glow">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={99} suffix="%" label="Detection Accuracy" />
          <StatCounter value={5} suffix="s" label="Avg Processing Time" />
          <StatCounter value={500} suffix="+" label="Active Tenants" />
          <StatCounter value={10} suffix="M+" label="Images Processed" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for Retail Intelligence</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every tool you need to monitor, analyze, and optimize your shelf presence at scale.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="platform" className="py-20 md:py-28 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How ALPHA IR Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From image capture to business insights in three simple steps.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Capture', desc: 'Field teams capture shelf photos via mobile. Images are uploaded to secure cloud storage with tenant isolation.', icon: Globe },
              { step: '02', title: 'Detect', desc: 'AI vision models analyze images in <5 seconds. Detect SKUs, count facings, identify gaps, and calculate share of shelf.', icon: Eye },
              { step: '03', title: 'Act', desc: 'Real-time dashboards surface compliance issues. Automated alerts notify teams of missing products or planogram violations.', icon: TrendingUp },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.15}>
                <div className="relative p-8 rounded-2xl bg-card border border-border text-center">
                  <div className="text-6xl font-bold text-primary/10 absolute top-4 right-6">{s.step}</div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-5 shadow-md">
                    <s.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="use-cases" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Who Uses ALPHA IR?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Trusted by retail chains, CPG brands, and merchandising teams worldwide.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <FadeIn key={uc.title} delay={i * 0.1}>
                <div className="flex gap-5 p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all h-full">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <uc.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 md:py-28 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Start free and scale as you grow. No hidden fees.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', desc: 'For small teams getting started', features: ['50 SKUs', '300 images/week', '1 store', 'Basic analytics', 'Email support'], highlight: false },
              { name: 'Professional', price: '$299', desc: 'For growing retail operations', features: ['500 SKUs', '5,000 images/month', '25 stores', 'Planogram compliance', 'Custom training', 'API access', 'Priority support'], highlight: true },
              { name: 'Enterprise', price: 'Custom', desc: 'For large-scale deployments', features: ['Unlimited SKUs', 'Unlimited images', 'Unlimited stores', 'Dedicated infrastructure', 'Custom models', 'SLA guarantee', '24/7 support'], highlight: false },
            ].map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={cn(
                  "p-8 rounded-2xl border h-full flex flex-col",
                  plan.highlight ? "bg-card border-primary shadow-lg relative" : "bg-card border-border"
                )}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">Most Popular</div>
                  )}
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-4 mb-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.price !== 'Custom' && plan.price !== 'Free' && <span className="text-muted-foreground text-sm">/month</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'}>
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to Transform Your Shelf Intelligence?</h2>
            <p className="text-lg text-muted-foreground mb-10">Join hundreds of retail brands using ALPHA IR to optimize shelf presence and drive sales growth.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg btn-glow">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">ALPHA IR</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered retail shelf intelligence platform.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ALPHA IR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
