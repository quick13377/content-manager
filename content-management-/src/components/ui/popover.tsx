"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverClose = PopoverPrimitive.Close

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    showCloseButton?: boolean
    animationDuration?: number
  }
>(({ className, align = "center", sideOffset = 4, showCloseButton = false, animationDuration = 150, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2`,
        className
      )}
      style={{ 
        '--animation-duration': `${animationDuration}ms`,
      } as React.CSSProperties}
      {...props}
    >
      {props.children}
      {showCloseButton && (
        <PopoverClose asChild>
          <Button
            className="absolute top-2 right-2 h-6 w-6 p-0"
            variant="ghost"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverClose }