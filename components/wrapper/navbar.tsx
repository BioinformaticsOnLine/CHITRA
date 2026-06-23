"use client"

import { motion, AnimatePresence } from "motion/react"
import ModeToggle from '@/components/mode-toggle'
import { UserActions } from '@/components/chromoviz/user-actions'
import config from '@/config'
import { ChevronRight, HomeIcon, Info, BookOpen, FileText, Copy, MoreHorizontal, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { ShinyRotatingBorderButton } from "@/components/ui/shiny-rotating-border-button"
import { AboutSheet } from "@/components/chromoviz/about"
import { GuideSheet } from "@/components/chromoviz/guide"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useUser, useClerk } from "@clerk/nextjs";

const CITATION = `Pruthi, P., Narayan, J., Agarwal, P., Shukla, N., & Bhatia, A. (2024). CHITRA: Chromosome Interactive Tool for Rearrangement Analysis. CSIR-IGIB.`

function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  if (paths.length === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-50">
        <HomeIcon className="h-4 w-4" />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`
        const isLast = index === paths.length - 1

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link
              href={href}
              className={clsx(
                "capitalize hover:text-gray-900 dark:hover:text-gray-50",
                { "text-gray-900 dark:text-gray-50": isLast }
              )}
            >
              {path}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function NavButton({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsLoading(true)
    router.push(href)
  }

  return (
    <Link href={href} onClick={handleClick}>
      <Button
        variant="ghost"
        className="h-8 w-auto hover:bg-background/80 text-sm p-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span className="ml-2">{children}</span>
      </Button>
    </Link>
  )
}

function CopyButton() {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CITATION)
      toast.success("Citation copied to clipboard", {
        description: "You can now paste it in your document",
        duration: 2000,
      })
    } catch (err) {
      toast.error("Failed to copy citation", {
        description: "Please try again or copy manually",
        duration: 2000,
      })
    }
  }

  return (
    <Button
      variant="ghost"
      className="h-8 w-8 sm:w-auto hover:bg-background/80 text-sm p-0 sm:p-2"
      onClick={handleCopy}
      data-copy-button="true"
    >
      <Copy className="h-4 w-4" />
      <span className="hidden sm:inline-block sm:ml-2">Cite</span>
    </Button>
  )
}

function NavActions() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      {/* Desktop view */}
      <div className="flex max-sm:hidden items-center gap-2">
        <AboutSheet>
          <Button
            variant="ghost"
            className="h-8 w-auto hover:bg-background/80 text-sm p-2"
          >
            <Info className="h-4 w-4" />
            <span className="ml-2">About</span>
          </Button>
        </AboutSheet>
        <Button
          variant="ghost"
          className="h-8 w-auto hover:bg-background/80 text-sm p-2"
          onClick={() => setIsGuideOpen(true)}
        >
          <BookOpen className="h-4 w-4" />
          <span className="ml-2">Guide</span>
        </Button>
        <NavButton href="/docs" icon={FileText}>
          Docs
        </NavButton>
        <CopyButton />
      </div>

      {/* Mobile view with icons */}
      <div className="flex sm:hidden items-center gap-0.5">
        <AboutSheet>
          <Button
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-background/80"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
        </AboutSheet>

        <Button
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-background/80"
          onClick={() => setIsGuideOpen(true)}
        >
          <BookOpen className="h-3.5 w-3.5" />
        </Button>

        <Link href="/docs">
          <Button
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-background/80"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-background/80"
          onClick={() => {
            const copyButton = document.querySelector('[data-copy-button="true"]') as HTMLButtonElement;
            copyButton?.click();
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <GuideSheet open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </>
  )
}

function GetStartedButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    router.push('/chitra');
  };

  return (
    <div className="relative overflow-hidden rounded-full shadow group p-0.5">
      <span className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite_reverse] bg-[conic-gradient(from_90deg_at_50%_50%,#4f46e5_0%,#06b6d4_25%,#3b82f6_50%,#4f46e5_75%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#1d4ed8_0%,#2563eb_25%,#3b82f6_50%,#60a5fa_75%)]" />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="relative flex items-center gap-1 h-7 px-3 rounded-full font-medium bg-white/80 dark:bg-black/80 backdrop-blur-xl text-zinc-800 dark:text-zinc-200 border-0 transition-colors duration-300 z-10 text-xs whitespace-nowrap @sm:h-8 @sm:px-4 @sm:text-sm cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            Get Started
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </div>
  );
}

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isChitraPage = pathname === '/chitra'
  // const [user, setUser] = useState<User | null>(null)
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter()

  // Removed Supabase auth listeners

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    toast.success("You have been signed out.");
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-[50px] sm:h-[60px]"
      layout
    >
      <motion.header
        layout
        className={clsx(
          "w-full h-full relative",
          isHomePage && [
            isScrolled
              ? "max-w-2xl mx-auto px-1 sm:px-4"
              : "w-full px-2 sm:px-8",
            "rounded-full",
            isScrolled
              ? "bg-background/40 backdrop-blur-lg brightness-[1.1] border border-white/10 dark:border-white/5"
              : "bg-background/30 backdrop-blur-lg"
          ],
          !isHomePage && [
            isScrolled
              ? "bg-background/40 backdrop-blur-lg brightness-[1.1] border-b border-white/10 dark:border-white/5"
              : "bg-background/30 backdrop-blur-lg"
          ]
        )}
      >
        {/* Glass edge with animation */}
        <motion.div
          layout
          className={clsx(
            "absolute inset-x-0 -bottom-px h-px",
            "bg-linear-to-r from-transparent via-white/15 to-transparent",
            "backdrop-blur-sm",
            isHomePage && "rounded-full"
          )}
        />

        <motion.div
          layout
          className={clsx(
            "flex items-center justify-between",
            isHomePage && !isScrolled
              ? "h-16 sm:h-20 px-3 sm:px-8 max-w-7xl mx-auto"
              : "h-12 sm:h-14 lg:h-[55px] px-1 sm:px-4 md:px-6 lg:px-8"
          )}
        >
          {/* Left side - Logo and Title */}
          <motion.div
            layout
            className="flex items-center gap-2 sm:gap-4"
          >
            <Link href="/">
              <ShinyRotatingBorderButton className={clsx(
                "p-1! sm:p-1.5! px-2! sm:px-3!",
                isHomePage && "border-0!"
              )}>
                <span className="text-xs sm:text-sm font-bold tracking-tight">CHITRA</span>
              </ShinyRotatingBorderButton>
            </Link>
            <NavActions />
          </motion.div>

          {/* Right side content */}
          <motion.div
            layout
            className="flex items-center gap-2 sm:gap-4"
          >
            {!isHomePage && (
              <div className="hidden md:flex">
                <Breadcrumbs />
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-2">
              {config?.auth?.enabled && (
                <UserActions onSignOut={handleSignOut} onShare={async () => null} onSave={async () => null} />
              )}
              <ModeToggle />
              {!isChitraPage && <GetStartedButton />}
            </div>
          </motion.div>
        </motion.div>
      </motion.header>
    </motion.div>
  )
}
