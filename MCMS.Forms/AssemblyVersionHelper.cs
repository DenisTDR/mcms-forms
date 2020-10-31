using System.Reflection;

namespace MCMS.Forms
{
    public static class AssemblyVersionHelper
    {
        public static string Version =>
            typeof(AssemblyVersionHelper).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion;
    }
}