type LoaderProps = {
  text?: string;
};

export function Loader({ text }: LoaderProps) {
  return (
    <div className='min-h-[50vh] flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4' />
        {text && <p className='text-gray-600'>{text}</p>}
      </div>
    </div>
  );
}
