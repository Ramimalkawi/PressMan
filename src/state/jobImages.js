import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export function useJobImages() {
  const [images, setImages] = useState({});

  const getJobImage = useCallback(async (orderId) => {
    if (images[String(orderId)]) return images[String(orderId)];

    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${orderId}`;

    const { data, error } = await supabase.storage
      .from("job-images")
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error || !data) return null;

    setImages((prev) => ({ ...prev, [String(orderId)]: data.signedUrl }));
    return data.signedUrl;
  }, [images]);

  const setJobImage = useCallback(async (orderId, dataUrl) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${orderId}`;

    // Convert base64 dataUrl to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const { error } = await supabase.storage
      .from("job-images")
      .upload(path, blob, { upsert: true, contentType: blob.type });

    if (!error) {
      setImages((prev) => ({ ...prev, [String(orderId)]: dataUrl }));
    }
  }, []);

  const removeJobImage = useCallback(async (orderId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${orderId}`;

    await supabase.storage.from("job-images").remove([path]);
    setImages((prev) => {
      const next = { ...prev };
      delete next[String(orderId)];
      return next;
    });
  }, []);

  return { getJobImage, setJobImage, removeJobImage };
}
