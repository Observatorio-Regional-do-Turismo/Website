declare type LayoutProps = Readonly<{
  children: React.ReactNode;
}>

declare type HeaderColorOptions = "background" | "highlight"

declare type HeroiconsIcon = React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string, titleId?: string } & React.RefAttributes<SVGSVGElement>>;