import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading users">
      <Skeleton variant="text" width={180} height={40} />
      <Skeleton variant="rounded" height={44} className="mt-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={52} className="mt-2" />
      ))}
    </div>
  );
}
