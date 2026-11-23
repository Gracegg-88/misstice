import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/vendors";
import IllustrationPhotosClient, {
  type IllustrationPhoto,
} from "@/components/admin/IllustrationPhotosClient";

export default async function AdminPhotosIllustrationPage() {
  const supabase = createClient();
  const categories = await getCategories();
  const { data } = await supabase
    .from("category_illustration_photos")
    .select("id, category, url, position")
    .order("position", { ascending: true });

  return (
    <IllustrationPhotosClient
      categories={categories}
      photos={(data as IllustrationPhoto[]) ?? []}
    />
  );
}
