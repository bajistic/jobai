'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <header className="px-6 py-4 border-b bg-white dark:bg-gray-950 dark:border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 dark:bg-primary/30 p-1.5 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary dark:text-primary-foreground"
              >
                <path d="M13 2H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9z"></path>
                <path d="M13 2v7h7"></path>
                <path d="m9 17-2-2-2 2"></path>
                <path d="M9 11v6"></path>
                <path d="m17 17 2-2 2 2"></path>
                <path d="M17 11v6"></path>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ZapJob</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/beta-signup">
              <Button variant="default" className="rounded-full">Request Beta Access</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Introducing ZapJob
                  </h1>
                  <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
                    Your AI Job Assistant
                  </h2>
                  <p className="max-w-[600px] text-gray-500 dark:text-gray-300 md:text-xl">
                    Experience the future of job hunting with our cutting-edge AI Job Assistant. Designed to automate your entire job search process, from finding perfect listings to preparing you for interviews.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/beta-signup">
                    <Button size="lg" className="rounded-full">Request Beta Access</Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-full min-h-[300px] lg:min-h-[500px]">
                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl border dark:border-gray-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <div className="absolute inset-0 flex items-center justify-center opacity-80">
                        <div className="w-full max-w-3xl p-4">
                          {/* Mock dashboard UI */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <div className="flex border-b dark:border-gray-700">
                              <div className="w-1/3 p-3 border-r dark:border-gray-700">
                                <div className="h-8 w-4/5 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="space-y-3">
                                  {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex">
                                      <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded flex items-center p-2">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 mr-2"></div>
                                        <div className="flex-1">
                                          <div className="h-3 w-full bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                          <div className="h-2 w-4/5 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="w-2/3 p-4">
                                <div className="h-8 w-3/5 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                                <div className="space-y-4">
                                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                                  <div className="h-4 w-4/5 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                                  <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="mt-8 space-y-2">
                                  <div className="h-10 w-1/3 bg-primary/20 rounded"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t dark:border-gray-700">
                      <h3 className="mb-4 text-xl font-bold">How it works</h3>
                      <ul className="space-y-3">
                        <li className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">1</div>
                          <div>
                            <h4 className="font-medium">Import your resume</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Upload your resume or CV for personalized job matches</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">2</div>
                          <div>
                            <h4 className="font-medium">AI scans job listings</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Our AI scans and ranks jobs based on your skills and preferences</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">3</div>
                          <div>
                            <h4 className="font-medium">Generate cover letters</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Create customized cover letters for your applications</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 md:py-24 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 items-center">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Key Features</h2>
                <p className="max-w-[600px] mx-auto text-gray-500 dark:text-gray-300 md:text-xl">
                  Streamline your job search process with our powerful AI tools
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center space-y-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                  <div className="p-3 bg-primary/10 dark:bg-primary/30 rounded-full text-primary dark:text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <path d="m9.5 7.5-2 2a4.95 4.95 0 1 0 7 7l2-2a4.95 4.95 0 1 0-7-7Z" />
                      <path d="M14 6.5v10" />
                      <path d="M10 7.5v10" />
                      <path d="m16 7 1-5 1.37.68A3 3 0 0 0 19.7 3H21v1.3c0 .46.1.92.32 1.33L22 7l-5 1" />
                      <path d="m8 17-1 5-1.37-.68A3 3 0 0 0 4.3 21H3v-1.3a3 3 0 0 0-.32-1.33L2 17l5-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Automated Job Search</h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Leverage advanced AI to explore opportunities tailored to your skills and preferences
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                  <div className="p-3 bg-primary/10 dark:bg-primary/30 rounded-full text-primary dark:text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Smart Cover Letters</h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Generate personalized cover letters optimized for each job application
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                  <div className="p-3 bg-primary/10 dark:bg-primary/30 rounded-full text-primary dark:text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Interview Preparation</h3>
                  <p className="text-center text-gray-500 dark:text-gray-300">
                    Get ready with AI-generated questions, tips, and simulated practice sessions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-6 md:pr-12">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Smart Appointment Scheduling
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Effortlessly manage your interview schedules with integration capabilities for popular calendar services such as Google Calendar and Outlook. Coordinate with potential employers without the hassle.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p>Automatic appointment reminders</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p>Calendar sync across devices</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 text-primary mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p>Time zone adjustment for remote interviews</p>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Privacy & Security</h3>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Your data security is our top priority. We implement robust encryption and adhere to global data protection laws, including GDPR and CCPA, ensuring your personal information remains safe.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Navigate the complexities of job application automation with a tool designed to align with legal standards, guaranteeing that every automated action is compliant with data protection regulations.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      <path d="M8 11l3 3 6-6" />
                    </svg>
                    <span>Bank-level data encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">BETA ACCESS</span>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to transform your job search?</h2>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl">
                  Experience a new era of job searching with ZapJob. Sign up for our beta today and take a step towards a smarter, more efficient job hunting experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/auth/beta-signup">
                    <Button size="lg" className="rounded-full">Request Beta Access</Button>
                  </Link>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 flex justify-center items-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">100% Free Beta</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Our beta version is completely free to use. Start your enhanced job search now without any costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-8 border-t bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 dark:bg-primary/30 p-1.5 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary dark:text-primary-foreground"
                >
                  <path d="M13 2H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9z"></path>
                  <path d="M13 2v7h7"></path>
                  <path d="m9 17-2-2-2 2"></path>
                  <path d="M9 11v6"></path>
                  <path d="m17 17 2-2 2 2"></path>
                  <path d="M17 11v6"></path>
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">ZapJob</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
              <Link href="/auth/beta-signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                Request Beta Access
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} ZapJob. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
