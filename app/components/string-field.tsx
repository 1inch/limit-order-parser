import React, { InputHTMLAttributes } from "react";
import { Path, useForm } from "react-hook-form";
import { FieldValues } from "react-hook-form";

type FieldType<Form extends FieldValues, TContext = any, TTransformedValues extends FieldValues | undefined = undefined> =
  ReturnType<typeof useForm<Form, TContext, TTransformedValues>>;

export default function StringField<
  Form extends FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined
>(
  {
    formInstance,
    name,
    label,
    ...inputProps
  }: { formInstance: FieldType<Form, TContext, TTransformedValues>, name: Path<Form>, label: string }  & InputHTMLAttributes<HTMLElement>
) {
  return (
    <div className="field-container w-full flex items-center">
      <label htmlFor={name} className='text-1inch-text-1'>{label}: </label>
      <input id={name}
             className="flex-1 bg-1inch-bg-1 p-4 rounded-2xl outline-0"
             {...formInstance.register(name)}
             {...inputProps}></input>
    </div>
  )
}
