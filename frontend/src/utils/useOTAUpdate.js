import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { request } from './api';

// Current web bundle version injected from package.json at build time
const CURRENT_WEB_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'; 

export function useOTAUpdate() {
  const [status, setStatus] = useState('idle'); // idle, checking, downloading, ready-to-reload, reinstall-required, error
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // 1. Critical Safeguard: Notify CapacitorUpdater that the web app mounted successfully.
    // If this call isn't made, Capgo native side will revert to the previous working bundle
    // upon the next app relaunch (protecting from white-screens and JS crashes).
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady()
        .then(() => console.log('OTA: App marked as ready. Rollback protection armed.'))
        .catch((err) => console.error('OTA: Failed to notify ready', err));
    }

    // Run check on startup
    checkAndApplyUpdates();
  }, []);

  const checkAndApplyUpdates = async () => {
    // Only check updates on actual iOS/Android containers
    if (!Capacitor.isNativePlatform()) {
      console.log('OTA: Skipping check. Not running on native container.');
      return;
    }

    try {
      setStatus('checking');

      // Check network connectivity
      const netStatus = await Network.getStatus();
      if (!netStatus.connected) {
        console.log('OTA: Device offline, bypassing update check.');
        setStatus('idle');
        return;
      }

      // Fetch native package information
      const info = await App.getInfo();
      const nativeVersion = info.version; // e.g. "1.0.0"

      // Request update metadata from backend via the existing request utility
      const data = await request('/ota/check/', {
        method: 'POST',
        body: {
          platform: Capacitor.getPlatform(),
          native_version: nativeVersion,
          web_version: CURRENT_WEB_VERSION,
        },
      });

      if (!data || !data.update_available) {
        setStatus('idle');
        return;
      }

      setUpdateInfo(data);

      if (data.update_type === 'APK_REINSTALL') {
        setStatus('reinstall-required');
        return;
      }

      if (data.update_type === 'OTA_UPDATE') {
        await executeOtaDownload(data);
      }
    } catch (error) {
      console.error('OTA Error:', error);
      setStatus('error');
    }
  };

  const executeOtaDownload = async (updateData) => {
    try {
      setStatus('downloading');
      setDownloadProgress(0);

      // Listen to progress events from native downloader
      const progressListener = await CapacitorUpdater.addListener(
        'downloadProgress',
        (progress) => {
          setDownloadProgress(progress.percent);
        }
      );

      // Download, extract, and load update bundle to memory
      const bundle = await CapacitorUpdater.download({
        url: updateData.download_url,
        version: updateData.version,
      });

      progressListener.remove();
      setStatus('ready-to-reload');

      if (updateData.is_mandatory) {
        // Immediate reload for critical bugfixes
        applyUpdate(bundle.version);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setStatus('error');
    }
  };

  const applyUpdate = async (version) => {
    try {
      // Set update active and reload web view instantly
      await CapacitorUpdater.set({ version });
    } catch (err) {
      console.error('Failed to set active update:', err);
      setStatus('error');
    }
  };

  return {
    status,
    downloadProgress,
    updateInfo,
    applyUpdate: () => updateInfo && applyUpdate(updateInfo.version),
    checkAndApplyUpdates,
  };
}
