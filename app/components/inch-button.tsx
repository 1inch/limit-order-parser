import React, { ButtonHTMLAttributes } from "react";

export default function InchButton(
  {
    children,
    className,
    ...props
}: {
  children: React.ReactNode
} & ButtonHTMLAttributes<HTMLElement>) {
  return (
    <button className={`${className} bg-btn-color p-4 rounded-2xl hover:bg-btn-active-color`} {...props}>
      {children}
    </button>
  )
}
