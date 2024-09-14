"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
// Add a new class for the tab background
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm", // Change active state background to white
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// New animated tab indicator
const TabIndicator = ({ activeTabIndex, tabRefs }: { activeTabIndex: number; tabRefs: React.RefObject<HTMLButtonElement>[] }) => {
  const activeTab = tabRefs[activeTabIndex]?.current

  if (!activeTab) return null

  return (
    <motion.div
      className="absolute bottom-0 left-0 h-0.5 bg-primary"
      initial={false}
      animate={{
        width: activeTab.offsetWidth,
        x: activeTab.offsetLeft,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  )
}

// Enhanced Tabs component with animation
const AnimatedTabs: React.FC<TabsPrimitive.TabsProps & { children: React.ReactNode }> = ({ children, ...props }) => {
  const [activeTabIndex, setActiveTabIndex] = React.useState(0)
  const tabRefs = React.useRef<React.RefObject<HTMLButtonElement>[]>([])

  React.useEffect(() => {
    tabRefs.current = Array(React.Children.count(children))
      .fill(null)
      .map((_, i) => tabRefs.current[i] || React.createRef())
  }, [children])

  return (
    <Tabs
      {...props}
      onValueChange={(value) => {
        const index = React.Children.toArray(children).findIndex(
          (child) => React.isValidElement(child) && child.props.value === value
        )
        setActiveTabIndex(index)
        props.onValueChange?.(value)
      }}
    >
      <div className="relative">
        <TabsList className="bg-light-gray rounded-md"> {/* Add light grey background and rounded corners */}
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child) && child.type === TabsTrigger) {
              return React.cloneElement(child, { ref: tabRefs.current[index] })
            }
            return child
          })}
        </TabsList>
        <TabIndicator activeTabIndex={activeTabIndex} tabRefs={tabRefs.current} />
      </div>
      {children}
    </Tabs>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabs }