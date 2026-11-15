"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const SAFE_OFFSET = {
  top: "calc(max(env(safe-area-inset-top), 12px) + 8px)",
  bottom: "calc(max(env(safe-area-inset-bottom), 12px) + 8px)",
  left: "max(env(safe-area-inset-left), 16px)",
  right: "max(env(safe-area-inset-right), 16px)",
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // iPhone: debajo del notch / Dynamic Island y arriba de la barra de inicio (también en horizontal)
      offset={SAFE_OFFSET}
      mobileOffset={SAFE_OFFSET}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
