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
  const [downloadedBundle, setDownloadedBundle] = useState(null);

  useEffect(() => {
    // 1. Critical Safeguard: Notify platform that the web app mounted successfully.
    if (window.electronAPI) {
      window.electronAPI.notifyAppReady()
        .then(() => console.log('OTA: Electron App marked as ready.'))
        .catch((err) => console.error('OTA: Failed to notify ready in Electron', err));
    } else if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady()
        .then(() => console.log('OTA: App marked as ready. Rollback protection armed.'))
        .catch((err) => console.error('OTA: Failed to notify ready', err));
    }

    // Run check on startup
    checkAndApplyUpdates();
  }, []);

  const checkAndApplyUpdates = async () => {
    const isElectron = !!window.electronAPI;

    // Only check updates on actual iOS/Android containers or Electron
    if (!Capacitor.isNativePlatform() && !isElectron) {
      console.log('OTA: Skipping check. Not running on native container or Electron.');
      return;
    }

    try {
      setStatus('checking');

      // Check network connectivity
      if (isElectron) {
        if (!navigator.onLine) {
          console.log('OTA: Electron device offline, bypassing update check.');
          setStatus('idle');
          return;
        }
      } else {
        const netStatus = await Network.getStatus();
        if (!netStatus.connected) {
          console.log('OTA: Device offline, bypassing update check.');
          setStatus('idle');
          return;
        }
      }

      // Fetch native container version
      let nativeVersion;
      if (isElectron) {
        nativeVersion = await window.electronAPI.getNativeVersion();
      } else {
        const info = await App.getInfo();
        nativeVersion = info.version; // e.g. "1.0.0"
      }

      // Request update metadata from backend
      const isTestDevice = localStorage.getItem('is_test_device') === 'true';
      const data = await request('/ota/check/', {
        method: 'POST',
        body: {
          platform: isElectron ? 'electron' : Capacitor.getPlatform(),
          native_version: nativeVersion,
          web_version: CURRENT_WEB_VERSION,
          is_test_device: isTestDevice,
        },
      });

      if (!data) {
        setStatus('waiting-for-ui');
        return;
      }
      if (!data.update_available) {
        setStatus('idle');
        return;
      }

      setUpdateInfo(data);

      if (data.update_type === 'APK_REINSTALL') {
        setStatus('reinstall-required');
        return;
      }

      if (data.update_type === 'OTA_UPDATE') {
        if (isElectron) {
          await executeElectronOtaDownload(data);
        } else {
          await executeOtaDownload(data);
        }
      }
    } catch (error) {
      console.error('OTA Error:', error);
      setStatus('idle');
    }
  };

  const executeElectronOtaDownload = async (updateData) => {
    try {
      setStatus('downloading');
      setDownloadProgress(0);

      // Listen to progress events from Electron main process
      const removeProgress = window.electronAPI.onDownloadProgress((percent) => {
        setDownloadProgress(percent);
      });

      // Download and extract the update zip
      await window.electronAPI.downloadUpdate(updateData.download_url, updateData.version);

      removeProgress();
      setStatus('ready-to-reload');

      if (updateData.is_mandatory) {
        // Immediate reload for critical updates
        await applyElectronUpdate();
      }
    } catch (err) {
      console.error('Electron Download failed:', err);
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

      setDownloadedBundle(bundle);
      progressListener.remove();
      setStatus('ready-to-reload');

      if (updateData.is_mandatory) {
        applyMobileUpdate(bundle);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setStatus('error');
    }
  };

  const applyElectronUpdate = async () => {
    try {
      await window.electronAPI.applyUpdate(updateInfo.version);
    } catch (err) {
      console.error('Failed to apply Electron update:', err);
      setStatus('error');
    }
  };

  const applyMobileUpdate = async (bundleObj) => {
    try {
      await CapacitorUpdater.set(bundleObj);
    } catch (err) {
      console.error('Failed to set active mobile update:', err);
      setStatus('error');
    }
  };

  return {
    status,
    downloadProgress,
    updateInfo,
    applyUpdate: () => {
      if (window.electronAPI) {
        applyElectronUpdate();
      } else if (downloadedBundle) {
        applyMobileUpdate(downloadedBundle);
      }
    },
    checkAndApplyUpdates,
  };
}
