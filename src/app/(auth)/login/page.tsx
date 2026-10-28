import Image from "next/image"
import { Laptop, ShieldCheck, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffLoginForm } from "@/components/auth/staff-login-form"
import { StudentLoginForm } from "@/components/auth/student-login-form"

const FEATURES = [
  { icon: Laptop, title: "Ujian Online", subtitle: "Mudah & Praktis" },
  { icon: ShieldCheck, title: "Aman & Terpercaya", subtitle: "Sistem Terproteksi" },
  { icon: Zap, title: "Hasil Cepat", subtitle: "Real Time" },
]

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4 lg:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 lg:grid-cols-2">
        {/* Panel hero — identitas sekolah */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
          <Image
            src="/gedung-sekolah.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-black/50" />
          <div className="pointer-events-none absolute -top-12 -left-12 size-44 rotate-12 rounded-[2rem] bg-white/10" />
          <div className="pointer-events-none absolute top-1/3 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 size-56 rounded-full bg-black/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-white/90 ring-4 ring-white/20">
              <Image src="/logo-sekolah.png" alt="Logo MTs KH A Wahab Muhsin" width={72} height={72} className="object-contain" />
            </div>
            <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              Sistem CBT
            </span>
            <div>
              <h1 className="text-3xl font-bold leading-tight">MTs KH A Wahab Muhsin</h1>
              <p className="mt-2 text-primary-foreground/80">
                Berbasis Teknologi, Menuju Pendidikan yang Lebih Baik
              </p>
            </div>
            <p className="italic text-primary-foreground/70">
              &ldquo;Prestasi Hari Ini, Untuk Masa Depan yang Lebih Baik&rdquo;
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-2 text-center text-sm">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-xs text-primary-foreground/70">{f.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel form */}
        <div className="flex flex-col justify-center gap-6 bg-card p-8 sm:p-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/15">
              <Image src="/logo-sekolah.png" alt="Logo MTs KH A Wahab Muhsin" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Selamat Datang</h2>
              <p className="text-sm text-muted-foreground">di Sistem CBT MTs KH A Wahab Muhsin</p>
            </div>
            <p className="text-xs text-muted-foreground">Silakan login untuk melanjutkan ke aplikasi</p>
          </div>

          <Tabs defaultValue="siswa">
            <TabsList className="w-full">
              <TabsTrigger value="siswa" className="flex-1">
                Siswa
              </TabsTrigger>
              <TabsTrigger value="staf" className="flex-1">
                Staf
              </TabsTrigger>
            </TabsList>
            <TabsContent value="siswa" className="pt-4">
              <StudentLoginForm />
            </TabsContent>
            <TabsContent value="staf" className="pt-4">
              <StaffLoginForm />
            </TabsContent>
          </Tabs>

          <p className="border-t pt-4 text-center text-xs italic text-muted-foreground">
            &ldquo;Disiplin dalam Ujian, Jujur dalam Hasil&rdquo;
          </p>
        </div>
      </div>
    </main>
  )
}
