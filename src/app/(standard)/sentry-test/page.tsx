'use client';

import { useState } from 'react';

export default function SentryTestPage() {
  const [errorType, setErrorType] = useState<string | null>(null);

  if (errorType === 'render') {
    throw new Error('Sentry test: unhandled render error');
  }

  function triggerTypeError() {
    const obj = null;
    // @ts-expect-error -- intentional: accessing property on null
    obj.nonExistent();
  }

  function triggerReferenceError() {
    // @ts-expect-error -- intentional: accessing undefined variable
    const x = undeclaredVariable.value;
    return x;
  }

  function triggerRangeError() {
    const arr: number[] = [];
    arr.length = -1;
  }

  function triggerUnhandledPromise() {
    fetch('/api/this-endpoint-does-not-exist').then(res => {
      if (!res.ok) {
        throw new Error(
          `Sentry test: unhandled promise rejection (${res.status})`
        );
      }
    });
  }

  const errors = [
    {
      label: 'TypeError — access property on null',
      description:
        'Calls null.nonExistent() — common when data is unexpectedly null',
      handler: triggerTypeError,
    },
    {
      label: 'ReferenceError — undefined variable',
      description:
        'Reads an undeclared variable — common typo/missing import bug',
      handler: triggerReferenceError,
    },
    {
      label: 'RangeError — invalid array length',
      description:
        'Sets array length to -1 — common with bad math/calculations',
      handler: triggerRangeError,
    },
    {
      label: 'Unhandled Promise Rejection',
      description:
        'Fetch fails and the rejection is not caught — common async bug',
      handler: triggerUnhandledPromise,
    },
    {
      label: 'Render Error — component crash',
      description: 'Throws during React render — triggers the error boundary',
      handler: () => setErrorType('render'),
    },
  ];

  return (
    <div className='mx-auto max-w-xl py-16'>
      <h1 className='mb-2 text-center text-2xl font-bold'>
        Sentry Client Error Test
      </h1>
      <div className='space-y-4'>
        {errors.map(error => (
          <div
            key={error.label}
            className='flex items-center justify-between rounded-lg border p-4'
          >
            <div>
              <p className='font-medium'>{error.label}</p>
              <p className='text-sm text-muted-foreground'>
                {error.description}
              </p>
            </div>
            <button
              onClick={error.handler}
              className='shrink-0 rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600'
            >
              Trigger
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
