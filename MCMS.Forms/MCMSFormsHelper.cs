using System;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace MCMS.Forms
{
    public static class MCMSFormsHelper
    {
        public static string Version =>
            typeof(MCMSFormsHelper).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion;

        public static string GetBasePath(IUrlHelper urlHelper)
        {
            var pathFromEnv = Environment.GetEnvironmentVariable("MCMS_FORM_STATIC_FILES_PATH");
            var hasPathFromEnv = pathFromEnv is {};

            var basePath = !string.IsNullOrEmpty(pathFromEnv) ? pathFromEnv : "/_content/MCMS.Forms/mcms-forms-files/";
            if (basePath.EndsWith("/"))
            {
                basePath = basePath.TrimEnd('/');
            }

            if (!hasPathFromEnv)
            {
                var version = Version;
                basePath += $"/{version}";
            }

            if (!basePath.StartsWith("/") && !basePath.StartsWith("http"))
            {
                basePath = urlHelper.Content("~/" + basePath);
            }

            return basePath;
        }
    }
}