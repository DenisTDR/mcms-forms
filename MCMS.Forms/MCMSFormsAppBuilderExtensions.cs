using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.FileProviders;

namespace MCMS.Forms
{
    public static class MCMSFormsAppBuilderExtensions
    {
        public static void UseMCMSFormsStaticFiles(this IApplicationBuilder app)
        {
            var filesProvider =
                new ManifestEmbeddedFileProvider(typeof(MCMSFormsAppBuilderExtensions).Assembly, "resources/mcms-forms-files");

            app.UseStaticFiles(new StaticFileOptions
                {FileProvider = filesProvider, RequestPath = $"/mcms-forms-files/{AssemblyVersionHelper.Version}"});
        }
    }
}