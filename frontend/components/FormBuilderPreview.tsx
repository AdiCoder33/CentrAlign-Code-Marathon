'use client';

import { FormSchema } from "../lib/types";

interface Props {
  schema: FormSchema;
}

export const FormBuilderPreview = ({ schema }: Props) => {
  return (
    <div>
      <h3>{schema.title}</h3>
      {schema.description && <p>{schema.description}</p>}
      <ul>
        {schema.fields.map((field) => (
          <li key={field.name}>
            <strong>{field.label}</strong> — {field.type}
            {field.validation?.required ? " (required)" : ""}
            {field.validation && (
              <span className="pill">
                {Object.entries(field.validation)
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(" | ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
