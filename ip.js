async function handleRequest(request) {
  const headers = request.headers;

  const data = {
    ip: headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || null,
    userAgent: headers.get('User-Agent') || null,
    cf: {
      asn: request.cf?.asn || null,
      asOrganization: request.cf?.asOrganization || null,
      city: request.cf?.city || null,
      region: request.cf?.region || null,
      regionCode: request.cf?.regionCode || null,
      postalCode: request.cf?.postalCode || null,
      metroCode: request.cf?.metroCode || null,
      country: request.cf?.country || null,
      countryName: request.cf?.countryName || null,
      continent: request.cf?.continent || null,
      latitude: request.cf?.latitude || null,
      longitude: request.cf?.longitude || null,
      timezone: request.cf?.timezone || null,
      colo: request.cf?.colo || null,
      clientTcpRtt: request.cf?.clientTcpRtt || null,
      httpProtocol: request.cf?.httpProtocol || null,
      requestPriority: request.cf?.requestPriority || null,
      tlsCipher: request.cf?.tlsCipher || null,
      tlsVersion: request.cf?.tlsVersion || null,
      botManagement: request.cf?.botManagement || null,
    },
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
