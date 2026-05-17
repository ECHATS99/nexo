const IMGBB_KEY = '4570e06ef9e58fb1a106025dfb5f45f4';

export const storageService = {
  uploadFile: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      return {
        url: result.data.url,
        displayUrl: result.data.display_url,
        thumbUrl: result.data.thumb.url,
        deleteUrl: result.data.delete_url,
        title: result.data.title,
        id: result.data.id
      };
    } catch (error) {
      console.error("ImgBB upload error:", error);
      throw error;
    }
  },

  uploadProfilePhoto: async (_userId: string, file: File) => {
    const data = await storageService.uploadFile(file);
    return data.url;
  },

  uploadShopLogo: async (_shopId: string, file: File) => {
    const data = await storageService.uploadFile(file);
    return data.url;
  },

  uploadProductImage: async (_shopId: string, file: File) => {
    return storageService.uploadFile(file);
  }
};
