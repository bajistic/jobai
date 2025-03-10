'use client'

import { useTheme } from "./theme-provider"

export function ThemeShowcase() {
  const { currentTheme, themeColors } = useTheme()
  
  return (
    <div className="p-4 bg-ui-card rounded-lg border border-ui max-w-5xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-content-primary">ZapJob Theme Showcase</h2>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Brand Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium mb-2 text-content-primary">Brand Colors</h3>
          <div className="grid gap-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-brand-primary mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Primary</p>
                <p className="text-sm text-content-secondary">{themeColors.brand.primary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-brand-secondary mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Secondary</p>
                <p className="text-sm text-content-secondary">{themeColors.brand.secondary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-brand-tertiary mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Tertiary</p>
                <p className="text-sm text-content-secondary">{themeColors.brand.tertiary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-brand-accent mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Accent</p>
                <p className="text-sm text-content-secondary">{themeColors.brand.accent}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* UI Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium mb-2 text-content-primary">UI Colors</h3>
          <div className="grid gap-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-ui-background border border-ui-border mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Background</p>
                <p className="text-sm text-content-secondary">{themeColors.ui.background}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-ui-foreground mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Foreground</p>
                <p className="text-sm text-content-secondary">{themeColors.ui.foreground}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-ui-card border border-ui-border mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Card</p>
                <p className="text-sm text-content-secondary">{themeColors.ui.card}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded border-2 border-ui-border mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Border</p>
                <p className="text-sm text-content-secondary">{themeColors.ui.border}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium mb-2 text-content-primary">Status Colors</h3>
          <div className="grid gap-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-status-success mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Success</p>
                <p className="text-sm text-content-secondary">{themeColors.status.success}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-status-warning mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Warning</p>
                <p className="text-sm text-content-secondary">{themeColors.status.warning}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-status-error mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Error</p>
                <p className="text-sm text-content-secondary">{themeColors.status.error}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded bg-status-info mr-4"></div>
              <div>
                <p className="font-medium text-content-primary">Info</p>
                <p className="text-sm text-content-secondary">{themeColors.status.info}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Text Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium mb-2 text-content-primary">Text Colors</h3>
          <div className="grid gap-2">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded flex items-center justify-center bg-ui-card border border-ui-border mr-4">
                <span className="text-primary-content font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-primary-content">Primary</p>
                <p className="text-sm text-content-secondary">{themeColors.text.primary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded flex items-center justify-center bg-ui-card border border-ui-border mr-4">
                <span className="text-secondary-content font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-secondary-content">Secondary</p>
                <p className="text-sm text-content-secondary">{themeColors.text.secondary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded flex items-center justify-center bg-ui-card border border-ui-border mr-4">
                <span className="text-tertiary-content font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-tertiary-content">Tertiary</p>
                <p className="text-sm text-content-secondary">{themeColors.text.tertiary}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded flex items-center justify-center bg-ui-card border border-ui-border mr-4">
                <span className="text-disabled-content font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-disabled-content">Disabled</p>
                <p className="text-sm text-content-secondary">{themeColors.text.disabled}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Theme Status */}
      <div className="mt-8 pt-6 border-t border-ui-border">
        <p className="text-content-secondary">
          Current theme: <span className="font-medium text-content-primary">{currentTheme}</span>
        </p>
      </div>
    </div>
  )
}