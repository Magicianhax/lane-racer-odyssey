
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      closeButton={false}
      richColors={false}
      duration={1500}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#91d3d1]/20 group-[.toaster]:text-white group-[.toaster]:border-[#91d3d1]/30 group-[.toaster]:backdrop-blur-sm group-[.toaster]:shadow-lg group-[.toaster]:glassmorphism",
          description: "group-[.toast]:text-white/80",
          actionButton:
            "group-[.toast]:bg-[#91d3d1] group-[.toast]:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-[#91d3d1]/40 group-[.toast]:bg-[#91d3d1]/20",
          error: "group-[.toast]:border-red-500/30 group-[.toast]:bg-red-500/20",
          warning: "group-[.toast]:border-yellow-500/30 group-[.toast]:bg-yellow-500/20",
          info: "group-[.toast]:border-[#64d2ff]/30 group-[.toast]:bg-[#64d2ff]/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
