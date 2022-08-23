import { AxiosResponse } from 'axios';
import { useRef, useState } from 'react';

// Ref: https://www.techprescient.com/react-custom-hook-typescript-to-download-a-file-through-api/

interface DownloadFileProps {
  apiDefinition: () => Promise<AxiosResponse<Blob>>;
  getFileName: () => string;
  onError: () => void;
  postDownloading: () => void;
  preDownloading: () => void;
}

interface DownloadedFileInfo {
  download: () => Promise<void>;
  ref: React.MutableRefObject<HTMLAnchorElement | null>;
  name?: string;
  url?: string;
}

export const useDownloadFile = ({
  apiDefinition,
  getFileName,
  onError,
  postDownloading,
  preDownloading,
}: DownloadFileProps): DownloadedFileInfo => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [url, setUrl] = useState<string>();
  const [name, setName] = useState<string>();

  const download = async () => {
    try {
      // callback function before trying to load
      preDownloading();
      // Get data
      const { data } = await apiDefinition();
      // Store received data as an object url
      const fileUrl = URL.createObjectURL(new Blob([data]));
      setUrl(fileUrl);
      // set filename with callback function
      setName(getFileName());
      // Click the referenced anchor link to start downloading the file
      ref.current?.click();
      // callback function after downloading
      postDownloading();
      // Remove object url
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      // callback function for errors
      onError();
    }
  };

  return { download, name, ref, url };
};
