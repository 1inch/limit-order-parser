import React from "react";
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
    label
  }: { formInstance: FieldType<Form, TContext, TTransformedValues>, name: Path<Form>, label: string }
) {
  return (
    <div className="field-container w-full flex">
      <label htmlFor={name}>{label}: </label>
      <input id={name}
             className="flex-1"
             {...formInstance.register(name)}></input>
    </div>
  )
}
