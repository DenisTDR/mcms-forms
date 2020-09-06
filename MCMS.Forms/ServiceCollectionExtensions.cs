using System.Reflection;
using Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace MCMS.Forms
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddMCMSForms(this IServiceCollection services)
        {
            services.Configure<MvcRazorRuntimeCompilationOptions>(options =>
            {
                options.FileProviders.Add(new EmbeddedFileProvider(
                    typeof(ServiceCollectionExtensions).GetTypeInfo().Assembly,
                    "MCMS.Forms.Views"
                ));
            });
            return services;
        }
    }
}