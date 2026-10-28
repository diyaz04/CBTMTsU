import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffLoginForm } from "@/components/auth/staff-login-form"
import { StudentLoginForm } from "@/components/auth/student-login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg">CBT MKKS</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </main>
  )
}
