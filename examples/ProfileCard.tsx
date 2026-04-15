import { Skeletonify } from "../src";

export interface User {
  name: string;
  title: string;
  bio: string;
  avatar: string;
}

function ProfileCard({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-4 p-6 w-96 rounded-lg">
      <div className="flex gap-4 items-center">
        <img src={user.avatar} className="w-16 h-16 rounded-full" alt="" />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl">{user.name}</h2>
          <span className="text-sm">{user.title}</span>
        </div>
      </div>
      <p className="text-base">{user.bio}</p>
      <div className="flex gap-2">
        <div className="w-24 h-10 rounded" />
        <div className="w-24 h-10 rounded" />
      </div>
    </div>
  );
}

export default function ProfileCardExample({
  loading,
  user,
}: {
  loading: boolean;
  user: User;
}) {
  return (
    <Skeletonify loading={loading}>
      <ProfileCard user={user} />
    </Skeletonify>
  );
}
