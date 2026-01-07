import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X, Truck, Package, Globe, Zap } from 'lucide-react'
import { Button } from './button'
import { AnimatedGroup } from './animated-group'
import { cn } from '../../lib/utils'
import { SplineSceneDemo } from './spline-scene-demo'
import { RAGTechShowcase } from './rag-tech-showcase'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="absolute inset-0 -z-20">
                            <img
                                src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=3276&h=4095&fit=crop&crop=center"
                                alt="background"
                                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                                width="3276"
                                height="4095"
                            />
                        </AnimatedGroup>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        to="/register"
                                        className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-orange-200 bg-white/80 backdrop-blur-sm p-1 pl-4 shadow-lg shadow-orange-100 transition-all duration-300 hover:shadow-xl hover:border-orange-300">
                                        <span className="text-gray-700 text-sm font-medium">🚀 AI-Powered Logistics Intelligence</span>
                                        <span className="block h-4 w-0.5 bg-orange-200"></span>

                                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-white" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-white" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                        
                                    <h1
                                        className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-bold text-gray-900">
                                        Intelligent
                                        <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 bg-clip-text text-transparent block">
                                            Document Search
                                        </span>
                                        for Logistics
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-lg text-gray-600">
                                        Transform how your organization handles shipping documents, customs forms, and logistics data.
                                        AI-powered search that understands your business context instantly.
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
                                    <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-200">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-xl px-6 text-base bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 border-0">
                                            <Link to="/register">
                                                <span className="text-nowrap text-white font-semibold">Get Started</span>
                                            </Link>
                                        </Button>
                                    </div>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="rounded-xl px-6 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50">
                                        <Link to="/login">
                                            <span className="text-nowrap text-gray-700">View Demo</span>
                                        </Link>
                                    </Button>
                                </AnimatedGroup>

                                {/* Trust badges */}
                                <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span>Sub-second search</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span>60+ Countries</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span>10M+ Documents</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative mt-8 px-2 sm:mt-12 md:mt-20">
                                <div className="relative mx-auto max-w-7xl">
                                    <SplineSceneDemo />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
            <RAGTechShowcase />
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Solution', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
]

const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/90 max-w-4xl rounded-2xl border border-orange-100 backdrop-blur-lg shadow-lg shadow-orange-100/50 lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                to="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200 text-gray-700" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 text-gray-700" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            to={item.href}
                                            className="text-gray-600 hover:text-orange-600 block duration-150 font-medium">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-orange-100 p-6 shadow-lg md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                to={item.href}
                                                className="text-gray-600 hover:text-orange-600 block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className={cn('border-gray-200 hover:border-orange-300 hover:bg-orange-50', isScrolled && 'lg:hidden')}>
                                    <Link to="/login">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn('bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 border-0', isScrolled && 'lg:hidden')}>
                                    <Link to="/register">
                                        <span className="text-white">Sign Up</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn('bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 border-0', isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link to="/register">
                                        <span className="text-white">Get Started</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = ({ className }) => {
    return (
        <div className={cn('flex items-center space-x-3', className)}>
            {/* Generic logistics logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent leading-tight">
                    LogiSearch
                </span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                    Document AI
                </span>
            </div>
        </div>
    )
}
