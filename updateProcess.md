## Recent Updates (v1.6.4+)

### Deep Link System Info Collection (Ported from Swift SDK)

Added comprehensive system information collection and transmission to match Swift SDK functionality:

#### New Features:
1. **Clipboard UUID Detection**: Automatically detects and validates UUID format in clipboard when enabled
2. **Network Information Collection**: Gathers connection type, interface details, and network status
3. **Enhanced System Information**: Collects device details, screen dimensions, timezone, language settings
4. **Automatic Backend Communication**: Sends system info to backend API for deep link event tracking
5. **Short Code Matching**: Backend can match clipboard UUIDs to affiliate short codes

#### New Dependencies:
- `@react-native-clipboard/clipboard` - For clipboard access
- Enhanced axios usage for system info API calls

#### Implementation Details:
- All functionality matches Swift SDK exactly for data consistency
- Clipboard access only when `insertLinksClipboardEnabled` is true
- System info sent on deep link processing and initial app launch
- Verbose logging available for debugging
- Network connectivity detection and reporting

#### API Endpoints:
- `https://insertaffiliate.link/V1/appDeepLinkEvents` - System info collection

---

## Release Process

1. Update version number in package.json...
npm run build

2. Make changes, push to main
git tag v1.0...
git push origin --tags 

3. Release version update on github

4. Run npm publish to update - https://www.npmjs.com/package/insert-affiliate-react-native-sdk