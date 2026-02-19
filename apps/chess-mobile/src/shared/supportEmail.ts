import { Linking, Platform, Alert } from 'react-native';
import { t } from '../i18n';

interface SupportEmailOptions {
    kind: 'bug' | 'pact_idea';
}

export const openSupportEmail = async ({ kind }: SupportEmailOptions) => {
    const recipient = 'support@pactchess.com';
    let subject = '';
    let body = '';

    const platform = Platform.OS;
    let version = 'Unknown';
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json');
        if (pkg && pkg.version) {
            version = pkg.version;
        }
    } catch (e) {
        // ignore
    }

    if (kind === 'bug') {
        subject = t('support.bugReportSubject', { platform: platform.toUpperCase() });
        body = t('support.bugReportBody', {
            version,
            platform,
            device: Platform.select({ web: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web', default: 'Mobile' }) || 'Unknown'
        });
    } else {
        subject = t('support.pactIdeaSubject');
        body = t('support.pactIdeaBody');
    }

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    const url = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            throw new Error('Cannot open mailto');
        }
    } catch (error) {
        const title = t('errors.emailClientTitle');
        const msg = t('errors.emailClientBody', { recipient });

        if (Platform.OS === 'web') {
            window.alert(`${title}\n${msg}`);
        } else {
            Alert.alert(title, msg);
        }
    }
};
