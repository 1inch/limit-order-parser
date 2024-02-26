import React, { ButtonHTMLAttributes, HTMLAttributes } from "react";

export default function InchButton(
  {
    children,
    className,
    ...props
}: {
  children: React.ReactNode
} & HTMLAttributes<HTMLElement>) {
  return (
    <button type={'submit'}
            className={`${className} bg-btn-color p-4 rounded-2xl hover:bg-btn-active-color`} {...props}>
      {children}
    </button>
  )
}
